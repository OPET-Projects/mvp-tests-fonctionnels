import Link from 'next/link';
import {Vinyl} from '@/lib/types/vinyls';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
    CardDescription,
} from "../ui/card";
import Image from 'next/image';

const VinylItem = ({
                       vinyl, footer
                   }: {
    vinyl: Vinyl,
    footer: boolean
}) => {
    return (
        <Card className='w-80 justify-between'>
            <CardHeader>
                <CardTitle>{vinyl.title}</CardTitle>
                <CardDescription>{vinyl.artist}</CardDescription>
            </CardHeader>
            <CardContent className='flex flex-col items-center justify-center'>
                {vinyl.file_url ?
                    <Image
                        src={vinyl.file_url}
                        width={200}
                        height={200}
                        alt={vinyl.title}
                        loading="lazy"
                    /> :
                    <Image
                        src="https://ik.imagekit.io/gits23/placeholder.png"
                        width={200}
                        height={200}
                        alt="Picture of the author"
                        loading="lazy"
                    />
                }

                <CardDescription>{vinyl.description}</CardDescription>
            </CardContent>
            {footer && (
                <CardFooter>
                <Link
                    href={`/barter/${vinyl.id}`}
                    className="text-sm text-white font-semibold bg-black w-full text-center uppercase px-3 py-2 rounded-sm border border-black hover:bg-white hover:text-black transition"
                >
                    Échanger
                </Link>
            </CardFooter>
                )}
        </Card>

    );
};

export default VinylItem;
