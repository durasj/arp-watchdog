/**
 * Configuration
 *
 * @export
 * @class Config
 */
export default class Config {
    [key: string]: any;

    /**
     * Enable debuging
     *
     * Developer tools can be opened using Ctrl+Shift+I
     */
    public static ENABLE_DEBUG = true;

    /**
     * Enable logging to console
     */
    public static ENABLE_DEBUG_LOGGING = true;

    /**
     * Enable verbose logging
     *
     * WARNING: Can lead to great number of
     * logged info if large files are used
     * since a lot of repeating messages are logged
     * and all received data objects are logged
     */
    public static ENABLE_DEBUG_VERBOSE = false;

    /**
     * Load custom config.json
     *
     * Uses json object properties from the config.json
     * in the root dir and replaces the default options
     */
    public static loadCustom() {
        const customConfig = require('../config.json');
        Object.keys(customConfig).forEach((option) => {
            if (this[option] !== undefined) {
                this[option] = customConfig[option];
            }
        });
    }
}
