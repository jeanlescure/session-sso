import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import { SSOProvider, } from '../interfaces';

export default <SSOProvider>((
  {
    authKey: token,
    retrieveProperties = ['email',],
  },
) => {
  return new Promise((resolve, reject) => {
    try {
      const {
        header: {
          kid,
        },
      } = jwt.decode(token, { complete: true, }) as {[key: string]: { [key: string]: unknown }};

      fetch('https://www.googleapis.com/oauth2/v1/certs')
        .then((res) => res.json())
        .then((certs) => {
          const authPayload = jwt.verify(token, certs[kid as string], { algorithms: ['RS256',], });
        
          if (!retrieveProperties.reduce((a, b) => a && Object.keys(authPayload).includes(b), true)) {
            throw new Error('properties missing in auth payload');
          }

          const payload: { [key: string]: { [key: string]: unknown } } = retrieveProperties.reduce(
            (a, b) => {
              a[b] = authPayload[b];
              return a;
            },
            {},
          );

          resolve(payload);
        })
        .catch((e) => {
          reject(e.message);
        });
    } catch (e) {
      reject(e.message);
    }
  }).then((payload) => ({ payload, })).catch(((error) => ({ error, })));
});
