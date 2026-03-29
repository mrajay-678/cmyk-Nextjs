import Image from "next/image"
import Link from "next/link"
import styles from "@/styles/CraftSection.module.css"

export default function CraftSection() {
	return (
		<section className={styles.section} id="shop-custom">
			<div className={styles.container}>
				<div className={styles.grid}>
					<div className={styles.card + " " + styles.cardLeft}>
						<Image src="/assets/image/Your-art.png" alt="Artwork ready to print" width={520} height={520} />
					</div>
					<div className={styles.card}>
						<Image src="/assets/image/our-craft.png" alt="Finished t-shirt with print" width={760} height={760} />
						<div className={styles.actions}>
							<Link href="#offers" className={styles.button}>
								Start Creating
							</Link>
						</div>
					</div>
				</div>
			</div>
		</section>
	)
}
