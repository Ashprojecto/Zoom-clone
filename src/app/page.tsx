
import RoomForm from "@/components/RoomForm";

export default function Home() {
  return (
    <main className="flex items-center justify-center h-screen">
      <div className="bg-white sahdow-md p-8 rounded w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-black">Join a Room</h1>
        <RoomForm/>
      </div>
    </main>
  );
}
