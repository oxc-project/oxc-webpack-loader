interface Person {
  name: string;
  age: number;
}

type Node<T> = {
  name: string;
}

// Generic arrow function — must stay parseable as TS, not TSX (where `<T>` would be a JSX tag)
const traverse = <T>(node: Node<T> | null, visit: (node: Node<T>) => void) => {
  return false
};

function greet(person: Person): string {
  return `Hello, ${person.name}! You are ${person.age} years old.`;
}

export { greet };
