import VinylsListing from "@/components/vinyls/VinylsListing";
import { Vinyl } from "@/lib/types/vinyls";

const VinylsPage = async () => {
  const vinyls: Vinyl[] = [{
    id: 1,
    title: "Queen II",
    artist: "Queen",
    description: "As new",
    fileUrl: "https://ik.imagekit.io/gits23/Queen_II.jpeg",
    userId: "1",
    available: true
  }, {
    id: 2,
    title: "Cracker Island",
    artist: "Gorillaz",
    description: "Unsealed",
    fileUrl: "",
    userId: "1",
    available: true
  }, {
    id: 3,
    title: "Abbey Road",
    artist: "The Beatles",
    description: "Really good condition",
    fileUrl: "https://ik.imagekit.io/gits23/The-Beatles-Abbey-Road.jpg",
    userId: "1",
    available: true
  }]
  return (
    <VinylsListing vinyls={vinyls} />
  );
}

export default VinylsPage;