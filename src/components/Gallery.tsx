import Image from "next/image";
import styles from "@/styles/Gallery.module.css";

export type GalleryImage = {
  src: string;
  alt: string;
  tall?: boolean;
};

export default function Gallery({ images }: { images: GalleryImage[] }) {
  return (
    <section className={styles.section} id="gallery">
      <div className={styles.container}>
        <div className={styles.grid}>
          {images.map((image) => (
            <div
              key={image.src}
              className={`${styles.card} ${image.tall ? styles.tall : ""}`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(min-width: 1024px) 24vw, (min-width: 640px) 48vw, 100vw"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
