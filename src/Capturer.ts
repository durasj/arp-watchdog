import Debug from './Debug';
import os = require('os');

const Cap = require('cap').Cap;
const decoders = require('cap').decoders;
const PROTOCOL = decoders.PROTOCOL;

interface IDevice {
    id: string;
    name: string;
    addresses: string[];
}

interface IArpPacket {
    senderIp: string;
    senderMac: string;
    targetIp: string;
    targetMac: string;
    isReply: boolean;
}

interface ITable {
    [ip: string]: {
        when: number;
        mac: string;
    };
}

/**
 * Capturing class
 *
 * - listens on selected pcap 'device' (interface) for ARP packets
 * - saves ARP responses to local table
 * - calls problem callback if local table entry changed in short time
 * - does poisoning simulation on the selected device
 * - helper static classes
 *
 * @export
 * @class Capturer
 */
export default class Capturer {
    /**
     * Node module Cap instance
     */
    private cap: any;

    /**
     * Pcap device name that we are listening on
     */
    private deviceId: string;

    /**
     * Table with the IP:MAC/TIME combinations
     */
    private table: ITable = {};

    /**
     * Table clearing interval
     */
    private interval: number;

    /**
     * Callback called when ARP poisoning is detected
     */
    private problemCallback: (ipAddress: string) => void;

    /**
     * Creates new capturer
     */
    constructor(problemCallback: (ipAddress: string) => void) {
        this.cap = new Cap();
        this.problemCallback = problemCallback;
    }

    /**
     * Gets available devices from the pcap
     */
    public static getDevices(): IDevice[] {
        return Cap.deviceList().map((device: any) => ({
            id: device.name,
            name: device.description,
            addresses: device.addresses.map((a: any) => a.addr)
        }));
    }

    /**
     * Start listening on the selected device
     */
    public startOnDevice(deviceId: string) {
        this.deviceId = deviceId;

        const filter = 'arp';
        const bufSize = 10 * 1024 * 1024;
        const buffer = Buffer.alloc(65535);

        const linkType = this.cap.open(deviceId, filter, bufSize, buffer);

        return new Promise((resolve, reject) => {
            if (linkType !== 'ETHERNET') {
                reject('Unsupported link type. Only ethernet is supported.');
                return;
            }

            this.cap.setMinBytes(0);

            this.cap.on('packet', (nbytes: number, trunc: boolean) => {
                // raw packet data === buffer.slice(0, nbytes)
                const ret = decoders.Ethernet(buffer);
                const arp = decoders.ARP(buffer, ret.offset);

                Debug.logVerbose('Received packet', ret, arp, buffer);

                this.processArpPacket({
                    senderIp: arp.info.senderip,
                    senderMac: arp.info.sendermac,
                    targetIp: arp.info.targetip,
                    targetMac: arp.info.targetmac,
                    isReply: arp.info.opcode === 2
                });
            });

            // Plan clearing of old entries
            this.interval = setInterval(
                this.clearOld.bind(this),
                (11 * 1000)
            );

            resolve();
        });
    }

    /**
     * Stop listening on the current device
     */
    public stop() {
        this.cap.close();
        clearInterval(this.interval);
        this.cap = undefined;
        this.deviceId = undefined;
        this.table = {};
        this.interval = undefined;
    }

    /**
     * Get currently opened device id
     */
    public getDeviceId() {
        return this.deviceId;
    }

    /**
     * Simulates poisoning of the currently used device
     */
    public poison(macPart: number[]) {
        const deviceIpString =
            (<any[]>Cap.deviceList()).find(
                (d: any) => d.name === this.deviceId
            )
            .addresses.find((a: any) => this.isIPv4(a.addr))
            .addr;
        const interfaces = os.networkInterfaces();
        let deviceMacString: string;
        Object.keys(interfaces).forEach((name) => {
            const currInterf = interfaces[name];
            currInterf.forEach((a) => {
                if (a.address === deviceIpString) {
                    deviceMacString = a.mac;
                }
            });
        });

        const deviceMac = this.extractMacFromString(deviceMacString);
        const deviceIp = this.extractIpFromString(deviceIpString);

        const buffer = Buffer.from([
            // ETHERNET
            ...deviceMac,               // 0    = Destination MAC
            ...deviceMac,               // 6    = Source MAC
            0x08, 0x06,                 // 12   = EtherType = ARP
            // ARP
            0x00, 0x01,                 // 14/0   = Hardware Type = Ethernet (or wifi)
            0x08, 0x00,                 // 16/2   = Protocol type = ipv4 (request ipv4 route info)
            0x06, 0x04,                 // 18/4   = Hardware Addr Len (Ether/MAC = 6), Protocol Addr Len (ipv4 = 4)
            0x00, 0x02,                 // 20/6   = Operation (ARP, 2 - response)

            ...deviceMac,               // 22/8   = Sender Hardware Addr (MAC)
            ...deviceIp,                // 28/14  = Sender Protocol address (ipv4)
            0x0a, 0, 0, ...macPart, 0,  // 32/18  = Target Hardware Address (Blank/nulls for who-has)
            ...deviceIp                 // 38/24  = Target Protocol address (ipv4)
        ]);

        try {
            // send will not work if pcap_sendpacket is not supported by underlying device
            this.cap.send(buffer, buffer.length);
        } catch (e) {
            Debug.log('Error sending poison packet: ', e);
        }
    }

    /**
     * Uses ARP packet for table saving/issues reporting
     */
    private processArpPacket(packet: IArpPacket) {
        // We are only interested in replies
        if (!packet.isReply) {
            Debug.logVerbose('Who has ' + packet.targetIp + '? Tell ' + packet.senderIp);
            return;
        }

        Debug.log(packet.senderMac + ' is saying: ' + packet.targetIp + ' is at ' + packet.targetMac);

        const existing = this.table[packet.targetIp];
        // Check for any suspicious activity
        if (existing !== undefined) {
            const minuteInMs = 60 * 1000;
            const minuteAgoTimestamp = Date.now() - minuteInMs;

            const isRecent = (existing.when > minuteAgoTimestamp);
            if (existing.mac !== packet.targetMac && isRecent) {
                this.problemCallback(packet.targetIp);
                return;
            }
        }

        this.table[packet.targetIp] = {
            when: Date.now(),
            mac: packet.targetMac
        };
    }

    /**
     * Clears records older than minute from the table
     */
    private clearOld() {
        Object.keys(this.table).forEach((ip) => {
            const entry = this.table[ip];
            const minuteInMs = 60 * 1000;
            const minuteAgoTimestamp = Date.now() - minuteInMs;

            if (entry.when < minuteAgoTimestamp) {
                Debug.logVerbose('Deleting old entry', entry);
                delete this.table[ip];
            }
        });
    }

    /**
     * Is passed string an IPv4 address
     */
    private isIPv4(address: string) {
        return /\b((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.|$)){4}\b/.test(address);
    }

    /**
     * Array of numbers from the mac in human readable format
     */
    private extractMacFromString(mac: string) {
        return mac.split(':').map((n) => parseInt(n, 16));
    }

    /**
     * Array of numbers from the IP in human readable format
     */
    private extractIpFromString(ip: string) {
        return ip.split('.').map((n) => parseInt(n, 10));
    }
}
