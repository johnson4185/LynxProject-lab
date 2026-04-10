import { mockLinks } from '../mock/mockLinks';

export function getLinks() {
  return mockLinks;
}

export function getLinkById(id: string) {
  return mockLinks.find(link => link.id === id);
}
