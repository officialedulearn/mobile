import React from "react";
import { Text, type StyleProp, type TextStyle } from "react-native";

type Props = {
  content: string;
  baseStyle: StyleProp<TextStyle>;
  mentionStyle: StyleProp<TextStyle>;
};

export function MessageBodyWithMentions({
  content,
  baseStyle,
  mentionStyle,
}: Props) {
  const text = content || "";
  const re = /@(\w+)/g;
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      nodes.push(text.slice(last, m.index));
    }
    nodes.push(
      <Text key={`m-${m.index}`} style={[baseStyle, mentionStyle]}>
        @{m[1]}
      </Text>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    nodes.push(text.slice(last));
  }
  if (nodes.length === 0) {
    return <Text style={baseStyle}>{text}</Text>;
  }
  return <Text style={baseStyle}>{nodes}</Text>;
}
