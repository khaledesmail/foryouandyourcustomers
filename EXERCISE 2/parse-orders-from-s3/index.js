const { parsingOrders } = require('./orderParser');

exports.handler = async (event, context) => {

  // Get the object from the event and show its content type
  const bucket = event.Records[0].s3.bucket.name;
  const key = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, "")
  );
  const params = {
    Bucket: bucket,
    Key: key,
  };
  try {
    await parsingOrders(params);
  } catch (err) {
    const message = `Error getting object ${key} from bucket ${bucket}. Error: ${err}`;
    console.log(message);
    throw new Error(message);
  }
};






