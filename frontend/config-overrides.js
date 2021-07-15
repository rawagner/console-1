/* Copyright Contributors to the Open Cluster Management project */

const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')

module.exports = {
    webpack: function (config, env) {
        for (let _rule of config.module.rules) {
            if (_rule.oneOf) {
                _rule.oneOf.unshift({
                    test: [/\.hbs$/],
                    loader: 'handlebars-loader',
                    query: {
                        precompileOptions: {
                            knownHelpersOnly: false,
                        },
                    },
                })
                break
            }
        }

        config.plugins.push(
            new MonacoWebpackPlugin({
                languages: ['yaml'],
            })
        )

        // Turn off mergeLonghand css minification optimizations
        // This fixes patternfly select input not having borders in production
        for (let plugin of config.optimization.minimizer) {
            if (plugin.pluginDescriptor?.name === 'OptimizeCssAssetsWebpackPlugin') {
                plugin.options.cssProcessorPluginOptions.preset[1].mergeLonghand = false
            }
        }


        // Load source maps in dev mode
        if (env === 'development') {
            config.module.rules.push({
            test: /\.(js|mjs|jsx|ts|tsx)$/,
            use: ['source-map-loader'],
            enforce: 'pre',
            });

            // For `babel-loader` make sure that sourceMap is true.
            config.module.rules = config.module.rules.map(rule => {
            // `create-react-app` uses `babel-loader` in oneOf
            if (rule.oneOf) {
                rule.oneOf.map(oneOfRule => {
                if (
                    oneOfRule.loader &&
                    oneOfRule.loader.indexOf('babel-loader') !== -1
                ) {
                    if (oneOfRule.hasOwnProperty('options')) {
                    if (oneOfRule.options.hasOwnProperty('sourceMaps')) {
                        // eslint-disable-next-line no-param-reassign
                        oneOfRule.options.sourceMaps = true;
                    }
                    }
                }
                });
            }
            return rule;
            });
        }

        return config
    },
}
