import { Vinyl } from '@/lib/types/vinyls';
import VinylItem from "@/components/vinyls/VinylItem";
const VinylsListing = ({
  vinyls,
  haveTradeButton = true
}: {
  vinyls: Vinyl[]
  haveTradeButton?: boolean
}) => {
  return (
    <div className='container mx-auto p-10'>
      <h1 className='text-3xl font-bold center'>Vinyls</h1>
      <div className='flex flex-row gap-3 flex-wrap container mx-auto py-10'>
        {vinyls.map((vinyl) => (
          <VinylItem key={vinyl.id} vinyl={vinyl} footer={haveTradeButton} />
        ))}
      </div>
    </div>
  );
};

export default VinylsListing;
