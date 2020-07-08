const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = require('<SERVICE ACCOUNT KEY>');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const schema = require('./schema').schema;
const rootPath = 'apps/test/'; //Firestore root path-- leave blank for Firestore root
const dataFolder = './data/';

const json2firestore = (_JSON, db, schema, collection) => {
  let promises = [];
  Object.keys(_JSON).map(_doc => {
    const doc_id = _doc;
    console.log(doc_id);
    if (_doc === '__type__') return;
    let doc_data = Object.assign({}, _JSON[_doc]);
    Object.keys(doc_data).map(_doc_data => {
      if (doc_data[_doc_data] && doc_data[_doc_data].__type__) delete doc_data[_doc_data];
    });
    console.log(doc_data);
    promises.push(
      db
        .collection(`${rootPath}${collection}`)
        .doc(doc_id)
        .set(doc_data)
        .then(() => {
          return json2firestore(_JSON[_doc], db.collection(`${rootPath}${collection}`).doc(doc_id), schema[collection]);
        })
    );
  });
  return Promise.all(promises);
};

fs.readdir(dataFolder, (err, files) => {
  files.forEach(file => {
    const collection = file.substr(0, file.lastIndexOf('.'));
    const filesize = fs.statSync(`${dataFolder}${file}`).size;
    if (schema[collection]) {
      console.log(`Loading ${collection} (${filesize} bytes)`);
      json2firestore(
        JSON.parse(fs.readFileSync(`${dataFolder}${file}`, 'utf8')),
        admin.firestore(),
        {
          ...schema
        },
        collection
      ).then(() => console.log(`  ${collection} loaded`));
    }
  });
});
