const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const DBank = await ethers.getContractFactory("DBank");
  const dbank = await DBank.deploy();
  
  await dbank.waitForDeployment();
  const dbankAddress = await dbank.getAddress();
  
  console.log("DBank deployed to:", dbankAddress);

  // 確保目錄存在
  const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  // 保存合約地址
  fs.writeFileSync(
    path.join(contractsDir, "contract-address.json"),
    JSON.stringify({ DBank: dbankAddress }, null, 2)
  );
  console.log("Contract address written to", "contract-address.json");

  // 複製合約 ABI
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "DBank.sol",
    "DBank.json"
  );
  
  const artifact = JSON.parse(fs.readFileSync(artifactPath));
  
  fs.writeFileSync(
    path.join(contractsDir, "DBank.json"),
    JSON.stringify({ abi: artifact.abi }, null, 2)
  );
  console.log("ABI written to", "DBank.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });