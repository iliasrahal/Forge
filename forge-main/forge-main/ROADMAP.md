# Roadmap produit et technique Forge

Ce document constitue la référence pour les prochaines étapes de Forge.

## Priorité actuelle

La seule étape en cours est la **bibliothèque de prestations et de tarifs**.
Les étapes suivantes sont documentées pour préparer la suite, mais ne doivent
pas être développées avant validation explicite.

## Ordre fonctionnel

1. Bibliothèque de prestations / tarifs
2. Utilisation manuelle des prestations dans les devis
3. Utilisation des prestations par Forge dans la génération de devis
4. Acomptes / factures d’acompte
5. Acceptation du devis depuis le lien reçu par e-mail
6. Signature électronique du devis
7. Synchronisation automatique du statut du devis dans Forge
8. Relances intelligentes
9. Support / Nous contacter
10. Audit global stabilité / sécurité / mobile
11. Stripe
12. Bêta utilisateurs

## Acceptation publique d’un devis

Flux cible :

1. L’artisan crée le devis.
2. L’artisan envoie le devis par e-mail depuis Forge.
3. Le client reçoit puis ouvre un lien public sécurisé.
4. Le lien ouvre uniquement le devis concerné.
5. Le client consulte et accepte le devis.
6. Le client signe électroniquement le devis.
7. Forge enregistre l’acceptation et la signature.
8. Forge passe automatiquement le devis au statut `ACCEPTÉ`.
9. Forge conserve `acceptedAt`, `signedAt` et les informations de preuve
   nécessaires.
10. Le nouveau statut devient visible côté artisan sans modification manuelle.

Contraintes à prévoir :

- token non devinable, stocké sous forme sécurisée ;
- aucun accès public fondé sur un identifiant de devis prévisible ;
- accès strictement limité au document concerné ;
- expiration et révocation possibles ;
- validation exclusivement côté serveur ;
- acceptation idempotente et protection contre les doubles validations ;
- journalisation des opérations importantes ;
- conservation de `acceptedAt`, `signedAt` et des informations de preuve
  utiles.

## Signature électronique

La signature électronique concerne uniquement le devis. L’architecture future
devra pouvoir associer au devis :

- le nom du signataire ;
- la signature ;
- la date et l’heure (`signedAt`) ;
- le document signé ;
- le devis d’origine ;
- les traces utiles de l’acceptation et de la signature.

Après validation et signature, le devis passe automatiquement au statut
`ACCEPTÉ`. Le devis signé doit rester accessible dans Forge.

Cette première architecture ne devra jamais présenter une signature comme
juridiquement certifiée sans véritable prestataire spécialisé. Elle devra
permettre une intégration ultérieure avec un tel prestataire.

Les factures ne nécessitent pas de signature client. Les comptes rendus restent
simplement consultables, enregistrables et envoyables selon leur fonctionnement
prévu, sans signature obligatoire.

## Synchronisation avec Forge

Les actions publiques réalisées par le client devront être répercutées dans
Forge :

- devis accepté et signé : statut `ACCEPTÉ`, `acceptedAt`, `signedAt`,
  signataire et informations de preuve nécessaires ;
- mise à jour immédiatement visible par l’artisan ;
- source de vérité conservée côté serveur ;
- opérations idempotentes et traçables.

## Support / Nous contacter

Le point de contact principal est `contact@myforge.online`.

L’expérience de base utilise un lien `mailto:` afin d’ouvrir le client de
messagerie configuré par l’utilisateur, sans imposer Gmail. Le destinataire
reste `contact@myforge.online` et l’objet est prérempli selon le motif choisi.

Aucun faux chat ni système de tickets ne doit être ajouté sans backend de
support réel.

## Garde-fous

- Ne pas commencer une étape future sans validation explicite.
- Ne pas créer de mécanisme parallèle aux devis, documents ou statuts
  existants.
- Préserver les routes, données et fonctionnalités déjà en production.
- Faire respecter toutes les autorisations et transitions sensibles côté
  serveur.
- Vérifier sécurité, stabilité et responsive avant Stripe puis la bêta.

## Chantier technique séparé — migration Supabase native

La migration future de la couche Prisma vers une architecture Supabase native
sera traitée comme un chantier indépendant des étapes fonctionnelles ci-dessus.
Elle devra couvrir :

- la stratégie d’authentification Supabase ;
- le mapping progressif des utilisateurs existants ;
- la représentation des workspaces et memberships ;
- les policies RLS et les tests d’isolation ;
- la migration progressive des accès à la base ;
- la coexistence temporaire maîtrisée pendant la transition ;
- la suppression finale de Prisma uniquement lorsqu’aucun flux n’en dépendra.

Ce chantier ne doit pas être commencé pendant l’étape actuelle consacrée à la
bibliothèque de prestations et de tarifs.
