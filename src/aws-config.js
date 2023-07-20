import AWS from 'aws-sdk';

AWS.config.update({
  accessKeyId: '',
  secretAccessKey: '',
  region: 'us-west-2'
  
});

const s3 = new AWS.S3();

export default s3;

