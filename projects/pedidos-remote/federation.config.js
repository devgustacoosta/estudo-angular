const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');
module.exports = withNativeFederation({
  name: 'pedidos',
  exposes: { './Routes': './projects/pedidos-remote/src/app/order.routes.ts' },
  shared: { ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }) },
  sharedMappings: ['portal-contracts', 'portal-ui'],
  skip: [
    'express',
    'cors',
    '@softarc/native-federation-node',
    '@angular/animations',
    '@angular/platform-browser/animations',
    '@angular/forms/signals',
    '@angular/forms/signals/compat',
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
  ],
});
