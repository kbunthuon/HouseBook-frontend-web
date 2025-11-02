import { useState } from "react";
import { Card, CardContent } from "@ui/card";
import { Label } from "@ui/label";
import { Input } from "@ui/input";
import { Button } from "@ui/button";

export function FeatureCard({
  initialName = "",
  initialValue = "",
  onAdd,
  onCancel,
  className = "",
}: {
  initialName?: string;
  initialValue?: string;
  onAdd: (name: string, value: string) => void;
  onCancel: () => void;
  className?: string;
}) {
  const [name, setName] = useState(initialName);
  const [value, setValue] = useState(initialValue);

  return (
    <div className={`pt-3 ${className}`}>
      <Card className="w-full">
        <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto pt-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="block">Feature name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex-1">
              <Label className="block">Feature value</Label>
              <Input value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (name.trim()) {
                  onAdd(name.trim(), value);
                }
              }}
            >
              OK
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default FeatureCard;
