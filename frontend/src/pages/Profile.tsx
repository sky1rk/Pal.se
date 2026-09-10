import { useParams } from "react-router-dom";

export default function Profile() {
  const { user_id } = useParams();
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">Profile #{user_id}</h1>
    </main>
  );
}
