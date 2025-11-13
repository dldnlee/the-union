import * as React from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"

export function BannerComponent() {
  return (
    <Carousel className="w-full overflow-hidden">
      <CarouselContent>
        {Array.from({ length: 5 }).map((_, index) => (
          <CarouselItem key={index}>
            <div className="p-1">
              <Card className="w-full h-[200px]">
                {/* <CardContent className="flex items-center justify-center">
                </CardContent> */}
                <Image src="https://picsum.photos/seed/picsum/200/300" alt="dog" fill={true} className="object-cover"/>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  )
}
