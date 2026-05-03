export const users = [
  { id: 'alice', name: 'Alice', avatar: 'https://i.pravatar.cc/150?u=alice' },
  { id: 'bob', name: 'Bob', avatar: 'https://i.pravatar.cc/150?u=bob' },
  { id: 'charlie', name: 'Charlie', avatar: 'https://i.pravatar.cc/150?u=charlie' },
];

export const findUser = (id) => users.find((u) => u.id === id);
