type GoogleMapEmbedProps = {
  src: string;
  shopName: string;
};

export default function GoogleMapEmbed({ src, shopName }: GoogleMapEmbedProps) {
  if (!src) return null;

  return (
    <div className="w-full h-[240px] md:h-[320px] rounded-xl overflow-hidden border border-[rgba(59,47,37,0.1)]">
      <iframe
        src={src}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        title={`${shopName}の地図`}
      />
    </div>
  );
}
