import Image from "next/image";

export default function ArtToCraft() {
  return (
    <section className="bg-white px-6 py-16 md:py-20">
      <div className="grid items-center">
        <div className="relative flex flex-col items-center md:items-center">
          <div className="relative mb-6 w-full md:max-h-2/4 w-full md:max-w-2/4 sm:h-[56vh]">
            <img
              src="https://cmykprint.shop/wp-content/uploads/2025/12/6-3.png"
              alt="Our Craft"
              className="h-full object-contain"
            />
          </div>
          <div className="w-full max-w-6xl text-center sm:text-end">
            <button className="bg-pink-500 hover:bg-pink-600 text-white ms-auto px-6 py-3 rounded-full transition">
              Start Creating
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
