'use client'

import { ProductWithVariants } from "@/models";
import { useEffect, useState } from "react"
import Image from "next/image";


export default function HomePage() {
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/all-products');

        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const data = await response.json() as ProductWithVariants[];
        console.log('Products:', data);
        setProducts(data);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [])


  if (loading) {
    return (
      <div className="bg-white w-full h-full flex items-center justify-center">
        <p>Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white w-full h-full flex items-center justify-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white w-full h-full p-8">
      <h1 className="text-3xl font-bold mb-8">Products</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <Image 
            src={product.variants[0].images[0].image_url} alt={product.name}
            width={200}
            height={200}
            unoptimized
            />
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <p className="text-center text-gray-500 mt-8">No products found</p>
      )}
    </div>
  )
}