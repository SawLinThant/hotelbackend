const databaseConnectionString = 'postgresql://neondb_owner:ubvnP4wYT9cM@ep-cold-waterfall-a6cgglvr.us-west-2.aws.neon.tech/amused-salmon-26_db_2072933?sslmode=require';

const jwtSecretKey = "8a7b2c4f5e6d1a3f9b0c7e2d4a8f6c3e7d9f1b5a6c4e7f2d9a3f8c6b1d5e4f2"
const jwtExpTime = "30d";

const digitalOceanSecretAccessKey = "QYf7TF39wapUFAds/hRwL5gWQHuedvLyaowECtLEDoE";
const digitalOceanAccessKeyId = "6ZF5GJGTLMZZZNAST3UG";

module.exports = {
    digitalOceanAccessKeyId,
    digitalOceanSecretAccessKey,
    databaseConnectionString,
    jwtSecretKey,
    jwtExpTime,
};
