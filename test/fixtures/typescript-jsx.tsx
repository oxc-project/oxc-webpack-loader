interface Props {
  name: string;
}

function Greeting({ name }: Props) {
  return <div>Hello, {name}!</div>;
}

export default Greeting;
