const https = require("https");

exports.putRequest = (path, body) => {
  const options = {
    hostname: "virtserver.swaggerhub.com",
    path: `/fyayc-Test-Candidate/testCandidate/1.0.0/${path}`,
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let rawData = "";

      res.on("data", (chunk) => {
        rawData += chunk;
      });

      res.on("end", () => {
        try {
          if (rawData) {
            resolve(JSON.parse(rawData));
          } else {
            resolve(rawData);
          }
        } catch (err) {
          reject(new Error(err));
        }
      });
    });

    req.on("error", (err) => {
      reject(new Error(err));
    });
    req.write(JSON.stringify(body));
    req.end();
  });
};
