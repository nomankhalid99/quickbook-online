import crypto from 'crypto';
// Example JSON object
// const jsonObject = {
//     name: "John Doe",
//     age: 30,
//     email: "john.doe@example.com"
// };

const hashGenerator = (JsonString)=>{
    const hash = crypto.createHash('sha256').update(JsonString).digest('hex');
    return hash;

}

export {
    hashGenerator
}
