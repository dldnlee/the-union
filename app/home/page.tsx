
import { ProductWithVariants } from "@/models";
import { ProductCard } from "@/components/ProductCard";
import { BannerComponent } from "@/components/BannerComponent";


export default async function HomePage() {

  let products : ProductWithVariants[];
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/all-products`);

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }

    products = await response.json();
  } catch (err) {
    console.error('Error fetching products:', err);
    products = []
  }

  return (
    <div className="w-full h-full p-6 bg-white">
      <div className="mb-4">
        <BannerComponent />
      </div>
      <h1 className="text-3xl font-bold mb-3">제품</h1>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {products.map((product : ProductWithVariants) => {
          // Safe access to variants and images with fallback
          const imageUrl = product.variants?.[0]?.images?.[0]?.image_url || '/placeholder.png';

          return (
            
            <ProductCard
              key={product.id}
              name={product.name}
              description={product.description}
              base_price={product.base_price}
              image_url={imageUrl}
              id={product.id}
            />
          );
        })}
      </div>

      {products.length === 0 && (
        <p className="text-center text-gray-500 mt-8">No products found</p>
      )}
    </div>
  )
}