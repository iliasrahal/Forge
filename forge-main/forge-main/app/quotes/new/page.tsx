import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";
import { UNASSIGNED_QUOTE_CLIENT_ID } from "@/src/lib/quote-routes";


type NewQuotePageProps = {
  searchParams: Promise<{
    client?: string;
    title?: string;
    quoteLines?: string;
  }>;
};


export default async function NewQuotePage({
  searchParams,
}: NewQuotePageProps) {
  await requireCurrentUser();
  const workspaceContext = await requireWorkspaceContext("write");


  const {
    client: clientSearch,
    title,
    quoteLines,
  } = await searchParams;


  const cleanSearch =
    clientSearch?.trim() ?? "";


  const cleanTitle =
    title?.trim() ?? "";


  const allClients = await prisma.client.findMany({
      where: {
        organizationId: workspaceContext.workspace.id,
        archived: false,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        type: true,
        firstName: true,
        lastName: true,
        companyName: true,
        phone: true,
        postalCode: true,
        city: true,
      },
    });



  const normalizedSearch = cleanSearch.toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, "");



  const clients = cleanSearch
    ? allClients.filter((client) => {
        const fullName =
          client.type === "PARTICULIER"
            ? `${client.firstName ?? ""} ${
                client.lastName ?? ""
              }`
                .trim()
                .toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            : (
                client.companyName ?? ""
              ).toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, "");



        return fullName.includes(
          normalizedSearch,
        );
      })
    : allClients;



  function buildQuoteFormUrl(clientId: string) {
    const params =
      new URLSearchParams();



    if (cleanTitle) {
      params.set(
        "title",
        cleanTitle,
      );
    }



    if (quoteLines) {
      params.set("quoteLines", quoteLines);
    }



    const queryString =
      params.toString();



    return queryString
      ? `/clients/${clientId}/quotes/new?${queryString}`
      : `/clients/${clientId}/quotes/new`;
  }



  const initialClientId = cleanSearch && clients.length === 1
    ? clients[0].id
    : UNASSIGNED_QUOTE_CLIENT_ID;
  redirect(buildQuoteFormUrl(initialClientId));
}
