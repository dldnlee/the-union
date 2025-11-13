import ProductDetailClient from "./ProductDetailClient";
import { notFound } from "next/navigation";

interface ProductPageProps {
  params: Promise<{id: string;}>;
}

export default async function ProductDetailPage({params}: ProductPageProps) {
  const {id} = await params;

  // Fetch product from API
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/product/${id}`, {
    cache: 'no-store'
  });

  if (!response.ok) {
    notFound();
  }

  const product = await response.json();

  return <ProductDetailClient product={product} />;
}