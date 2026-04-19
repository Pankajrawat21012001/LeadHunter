import { readContacts } from "@/lib/csv";
import ContactsClient from "./ContactsClient";

export default async function ContactsPage() {
  const allContacts = readContacts().sort((a, b) => new Date(b.foundAt).getTime() - new Date(a.foundAt).getTime());

  return <ContactsClient initialContacts={allContacts} />;
}
