export const quoteIssuerOrganizationSelect = {
  name: true,
  type: true,
  logoDataUrl: true,
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
    organization?.type === "TEAM"
      ? clean(organization.name)
      : clean(user?.companyName);

  return {
    companyName,
    fullName,
    phone: clean(user?.phone),
    email: clean(user?.email),
  };
}

export function getQuoteIssuerLines(
  organization: IssuerOrganization | null | undefined,
) {
  const issuer = getQuoteIssuer(organization);

  return [
    issuer.companyName,
    issuer.fullName,
    issuer.phone,
    issuer.email,
  ].filter((value): value is string => Boolean(value));
}
