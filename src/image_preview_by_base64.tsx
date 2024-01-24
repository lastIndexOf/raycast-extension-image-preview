import { useEffect, useState } from "react";
import { Action, ActionPanel, Detail, List, getSelectedText } from "@raycast/api";
import sizeOf from "image-size";
import isBase64 from "is-base64";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const debounce = (fn: (...args: any[]) => void, wait: number) => {
  let timer: NodeJS.Timeout | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (...args: any[]) {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn(...args);
    }, wait);
  };
};

export default function Command() {
  const [loading, setLoading] = useState(false);
  const [hasSelectedText, setHasSelectedText] = useState(false);
  const [src, setSrc] = useState("");
  const [metadata, setMetadata] = useState({
    width: 0,
    height: 0,
    type: "",
  });

  useEffect(() => {
    const getText = async () => {
      try {
        const text = await getSelectedText();

        if (isBase64(text)) {
          setHasSelectedText(!!text.trim());
          setSrc(text);
        }
      } catch (err) {
        setSrc("");
      }
    };

    getText();
  }, []);

  useEffect(() => {
    const checkBase64Data = async () => {
      try {
        setLoading(true);

        const bf = Buffer.from(src, "base64");
        const size = sizeOf(new Uint8Array(bf));

        setMetadata(
          size as {
            width: number;
            height: number;
            type: string;
          },
        );
      } catch (err) {
        console.error("fetch image metadata error");
        setLoading(false);
        setSrc("");
        setHasSelectedText(false);
      }

      setLoading(false);
    };

    if (src) {
      checkBase64Data();
    }
  }, [src]);

  return src && metadata.type ? (
    <Detail
      markdown={`![image](data:image/${metadata.type};base64,${src})`}
      isLoading={loading}
      actions={
        <ActionPanel>
          <Action
            title="Back"
            shortcut={{ modifiers: [], key: "backspace" }}
            onAction={() => {
              setSrc("");
            }}
          />
        </ActionPanel>
      }
      navigationTitle="Image Preview"
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Height" text={`${metadata.height || "loading"}`} />
          <Detail.Metadata.Label title="Weight" text={`${metadata.width || "loading"}`} />
          <Detail.Metadata.TagList title="Type">
            <Detail.Metadata.TagList.Item text={`image${metadata.type ? `/${metadata.type}` : ""}`} color={"#eed535"} />
          </Detail.Metadata.TagList>
          <Detail.Metadata.Separator />
          <Detail.Metadata.Link title="Open In Browser" target={src} text="Open" />
        </Detail.Metadata>
      }
    />
  ) : (
    // If there is no selected image URL, you can also enter it actively.
    <List
      isLoading={hasSelectedText}
      searchBarPlaceholder="Input image url"
      onSearchTextChange={debounce((value: string) => setSrc(value), 500)}
    ></List>
  );
}
