import { useEffect, useState } from "react";
import { Action, ActionPanel, Detail, List, getSelectedText } from "@raycast/api";
import axios from "axios";
import sizeOf from "image-size";
import { checkImageByUrl } from "./helper";

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
        setHasSelectedText(!!text.trim());
        const isImage = await checkImageByUrl(text);

        if (isImage) {
          setSrc(text);
        } else {
          setHasSelectedText(false);
        }
      } catch (err) {
        setSrc("");
      }
    };

    getText();
  }, []);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setLoading(true);

        const res = await axios.get(src, {
          responseType: "arraybuffer",
        });

        const size = sizeOf(new Uint8Array(res.data));

        setMetadata(
          size as {
            width: number;
            height: number;
            type: string;
          },
        );
      } catch (err) {
        console.error("fetch image metadata error");
      }

      setLoading(false);
    };

    if (src) {
      fetchMetadata();
    }
  }, [src]);

  return src ? (
    <Detail
      markdown={`![image](${src})`}
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
