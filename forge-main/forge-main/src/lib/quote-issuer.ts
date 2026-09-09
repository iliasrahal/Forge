export const quoteIssuerOrganizationSelect = {
  name: true,
  type: true,
  logoDataUrl: true,
  legalName: true,
  siret: true,
  vatNumber: true,
  apeCode: true,
  addressStreet: true,
  addressPostalCode: true,
  addressCity: true,
  contactPhone: true,
  contactEmail: true,
  personalOwner: {
    select: {
      firstName: true,
      lastName: true,
      companyName: true,
      email: true,
      phone: true,
    },
  },
  members: {
    where: { role: "OWNER" as const },
    take: 1,
    select: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          companyName: true,
          email: true,
          phone: true,
        },
      },
    },
  },
} as const;

type IssuerUser = {
  firstName: string;
  lastName: string | null;
  companyName: string | null;
  email: string;
  phone: string;
};

type IssuerOrganization = {
  name: string;
  type: "PERSONAL" | "TEAM";
  legalName?: string | null;
  siret?: string | null;
  vatNumber?: string | null;
  apeCode?: string | null;
  addressStreet?: string | null;
  addressPostalCode?: string | null;
  addressCity?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  personalOwner: IssuerUser | null;
  members: Array<{ user: IssuerUser }>;
};

function clean(value: string | null | undefined) {
  return value?.trim() || null;
}

export function getQuoteIssuer(
  organization: IssuerOrganization | null | undefined,
) {
  const user =
    organization?.type === "PERSONAL"
      ? organization.personalOwner
      : organization?.members[0]?.user ?? null;
  const fullName = user
    ? clean(`${user.firstName} ${user.lastName ?? ""}`)
    : null;
  const companyName =
    clean(organization?.legalName) ??
    (organization?.type === "TEAM"
      ? clean(organization.name)
      : clean(user?.companyName));
  const cityLine = clean(
    [clean(organization?.addressPostalCode), clean(organization?.addressCity)]
      .filter(Boolean)
      .join(" "),
  );

  return {
    companyName,
    fullName,
    street: clean(organization?.addressStreet),
    cityLine,
    phone: clean(organization?.contactPhone) ?? clean(user?.phone),
    email: clean(organization?.contactEmail) ?? clean(user?.email),
    siret: clean(organization?.siret),
    vatNumber: clean(organization?.vatNumber),
    apeCode: clean(organization?.apeCode),
  };
}

export function getQuoteIssuerLines(
  organization: IssuerOrganization | null | undefined,
) {
  const issuer = getQuoteIssuer(organization);

  return [
    issuer.companyName,
    issuer.fullName,
    issuer.street,
    issuer.cityLine,
    issuer.phone,
    issuer.email,
    issuer.siret ? `SIRET ${issuer.siret}` : null,
    issuer.vatNumber ? `TVA ${issuer.vatNumber}` : null,
    issuer.apeCode ? `APE ${issuer.apeCode}` : null,
  ].filter((value): value is string => Boolean(value));
}
