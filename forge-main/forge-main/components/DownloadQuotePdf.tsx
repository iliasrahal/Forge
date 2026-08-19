"use client";


import { useRouter } from "next/navigation";


type DownloadQuotePdfProps = {
  pdfUrl: string;
  clientId: string;
  fileName: string;
};



export default function DownloadQuotePdf({
  pdfUrl,
  clientId,
  fileName,
}: DownloadQuotePdfProps) {


  const router = useRouter();



  async function handleDownload() {


    try {


      const response =
        await fetch(pdfUrl);



      if (!response.ok) {


        const errorText =
          await response.text();



        console.error(
          "Erreur génération PDF :",
          errorText,
        );



        return;
      }




      const blob =
        await response.blob();




      const url =
        window.URL.createObjectURL(blob);




      const link =
        document.createElement("a");




      link.href = url;



      link.download = fileName;




      document.body.appendChild(link);




      link.click();




      link.remove();




      window.URL.revokeObjectURL(url);




      setTimeout(() => {


        router.push(
          `/clients/${clientId}`,
        );


      }, 500);



    } catch (error) {


      console.error(
        "Erreur téléchargement PDF :",
        error,
      );


    }


  }




  return (
    <button
      type="button"
      onClick={handleDownload}
      className="block w-full rounded-2xl border border-blue-600 px-5 py-3 text-center font-semibold text-blue-700 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
    >
      Télécharger le PDF
    </button>
  );
}