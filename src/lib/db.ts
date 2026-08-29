import dbConnect from "./dbConnect";

export async function connectToDatabase() {
  return await dbConnect();
}

export default connectToDatabase;
