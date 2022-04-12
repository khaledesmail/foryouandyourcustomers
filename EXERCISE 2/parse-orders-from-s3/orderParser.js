const aws = require("aws-sdk");
const fast_csv = require("fast-csv");
const { Readable } = require("stream");
const { fileValidation } = require("./validator");
const { putRequest } = require("./api");
const s3 = new aws.S3({ apiVersion: "2006-03-01", region: "eu-central-1" });

/**
 * @param object params
 * returns objecr
 */

const coulmnFileOrder = [
  { name: "orderId", offset: Number(process.env.ORDERID_OFFSET) || 0 },
  { name: "orderDate", offset: Number(process.env.ORDERDATE_OFFSET) || 1 },
  { name: "userEmail", offset: Number(process.env.USER_EMAIL_OFFSET) || 2 },
  { name: "products", offset: Number(process.env.PRODUCTS_OFFSET) || 3 },
];

exports.parsingOrders = async (params) => {
  const file = await s3.getObject(params).promise();
  if (!fileValidation(file.ContentType)) {
    return {
      code: "OR-01",
      suesscus: false,
      message: "File should be in CSV format",
    };
  }
  const s3Stream = await _bufferToStream(file.Body);
  fast_csv
    .parseStream(s3Stream)
    .on("data", async (orderRow) => {
      const order = await _parsingObject(orderRow);
      console.log("order", order);
      const orderCreationResult = await _createOrder(order);
      console.log("orderCreationResult", orderCreationResult);
    })
    .on("end", (rowCount) => console.log(`Parsed ${rowCount} rows`))
    .on("error", (error) => console.error(error));
};

/**
 * @param object orderRow
 * returns object parsedObject
 */

async function _parsingObject(orderRow) {
  let parsedObject = {};
  let parsedProducts = [];
  coulmnFileOrder.forEach((coulmn) => {
    parsedObject[coulmn.name] = orderRow[coulmn.offset];
  });
  const products = parsedObject.products;
  const productsObjs = products.split(";");
  // each row is ended with ; so I need to pop last element because it will be always empty
  productsObjs.pop();
  let total = 0;
  productsObjs.forEach((product) => {
    let parsedProduct = product.split("|");
    let finalProduct = {
      productCode: parsedProduct[0],
      value: Number(parsedProduct[1]),
    };
    total += finalProduct.value;
    parsedProducts.push(finalProduct);
  });
  parsedObject.products = parsedProducts;
  parsedObject.total = total;
  return parsedObject;
}

/**
 * @param binary Buffer
 * returns readableInstanceStream Readable
 */

async function _bufferToStream(buffer) {
  const readableInstanceStream = new Readable({
    read() {
      this.push(buffer);
      this.push(null);
    },
  });
  return readableInstanceStream;
}

/**
 * @param object order
 * returns object
 */

async function _createOrder(order) {
  try {
    let parsedOrder = {
      id: order.orderId,
      email: order.userEmail,
      orderDate: order.orderDate,
      total: order.total,
      orderLines: order.products,
    };
    const result = await putRequest("order", parsedOrder);
    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: result,
    };
  } catch (error) {
    return {
      statusCode: error.statusCode,
      body: error.message,
    };
  }
}
