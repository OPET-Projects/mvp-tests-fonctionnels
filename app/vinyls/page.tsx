import VinylsListing from "@/components/vinyls/VinylsListing";
import { Vinyl } from "@/lib/types/vinyls";

const VinylsPage = async () => {
  const vinyls: Vinyl[] = [{
    id: 1,
    name: "Vinyl 1",
    description: "Description of Vinyl 1",
    user_id: 1,
    file_url: "https://ik.imagekit.io/gits23/Queen_II.jpeg",
    id_request_a: null,
    id_request_b: null
  }, {
    id: 2,
    name: "Vinyl 2",
    description: "Description of Vinyl 2",
    user_id: 2,
    file_url: "https://ik.imagekit.io/gits23/nevermind.jpeg",
    id_request_a: null,
    id_request_b: null
  }, {
    id: 3,
    name: "Vinyl 3",
    description: "Description of Vinyl 3",
    user_id: 1,
    file_url: "https://ik.imagekit.io/gits23/The-Beatles-Abbey-Road.jpg",
    id_request_a: null,
    id_request_b: null
  }]
  return (
    <VinylsListing vinyls={vinyls} />
  );
}

export default VinylsPage;