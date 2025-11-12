import Image from "next/image";

interface ProductCardProps {
  name: string;
  description: string;
  base_price: number;
  image_url: string;
}

export default function ProductCard({name, description, base_price, image_url} : ProductCardProps) {

  return (
    <div className="w-full bg-zinc-900 rounded-xl overflow-hidden shadow-lg">
      {/* Image Section */}
      <div className="relative w-full aspect-square bg-black flex items-center justify-center">
        <Image
          src={image_url}
          alt={description}
          fill
          className="object-cover"
        />
      </div>

      {/* Content Section */}
      <div className="bg-white p-3 space-y-2">
        <p className="text-gray-500 text-sm">TheUnion</p>
        <h3 className="text-md font-medium text-gray-900">{name}</h3>
        <p className="text-lg font-bold text-gray-900">{base_price.toLocaleString('ko-KR')}원</p>
      </div>
    </div>
  )
}