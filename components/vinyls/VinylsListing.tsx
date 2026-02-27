import Link from 'next/link';
import { Vinyl } from '@/lib/types/vinyls';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import Image from 'next/image'
const VinylsListing = ({
  vinyls
}: {
  vinyls: Vinyl[]
}) => {
  return (
    <div className='flex flex-row gap-3 flex-wrap container mx-auto py-10'>
      {vinyls.map((vinyl) => (
        <Card key={vinyl.id} className='w-80'>
          <CardHeader>
            <CardTitle>{vinyl.name}</CardTitle>
          </CardHeader>
          <CardContent className='flex flex-col items-center justify-center'>
            {vinyl.file_url &&
              <Image
              src={vinyl.file_url}
              width={200}
              height={200}
              alt="Picture of the author"
              />
            }

            <p>{vinyl.description}</p>
          </CardContent>
          <CardFooter>
            <Link href={`/echange/${vinyl.id}`} className='text-sm text-white font-semibold bg-black w-full text-center uppercase px-3 py-2 rounded-sm border border-black hover:bg-white hover:text-black transition'>Échanger</Link>

          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export default VinylsListing;