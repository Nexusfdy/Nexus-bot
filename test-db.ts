import { dbService } from "./src/db/db_service.ts";
async function run() {
  await dbService.saveProduct({
    id: "test",
    code: "TEST",
    name: "Test",
    price: 1000,
    description: "test",
    type: "License Key",
    stock: ["A", "B"],
    category: "test",
    createdAt: Date.now()
  });
  console.log(await dbService.getProducts());
  process.exit(0);
}
run();
