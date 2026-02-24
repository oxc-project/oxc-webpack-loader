const greet = (name) => `Hello, ${name}!`;

const obj = { a: 1, b: 2, c: 3 };
const { a, ...rest } = obj;

export { greet, rest };
