module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            stream: 'stream-browserify',
            events: 'events',
            buffer: 'buffer',
            process: 'process/browser',
            util: 'util',
            assert: 'assert',
          },
        },
      ],
     
    ],
  };
};
