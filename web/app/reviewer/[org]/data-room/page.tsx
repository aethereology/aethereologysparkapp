import { Card, CardContent } from "@/components/ui/card";
import { getDataRoomIndex } from "@/lib/api";
import { DataRoomFolder } from "@/types/api";
export default async function DataRoom({ params }: { params: { org: string }}) {
  const org = params.org || "spark";
  const folders = await getDataRoomIndex(org);
  return (<div className="grid gap-4">
    <Card><CardContent>
      <h1 className="text-xl font-semibold mb-1 capitalize">{org} — Data Room</h1>
      <p className="opacity-75">Standard reviewer package. Access can be time-bounded per reviewer.</p>
    </CardContent></Card>
    <div className="grid md:grid-cols-2 gap-4">
      {folders.map((folder: DataRoomFolder) => (
        <Card key={folder.folder}>
          <CardContent>
            <div className="font-semibold mb-2 capitalize">{folder.folder}</div>
            <ul className="list-disc pl-5 space-y-1">
              {folder.items.map((item: string) => (
                <li key={item} className="opacity-80">{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>);
}