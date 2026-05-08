import React from "react";
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  ModalProps,
} from "react-native";

interface AppModalProps extends Omit<ModalProps, "visible"> {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  contentStyle?: ViewStyle;
}

const AppModal: React.FC<AppModalProps> = ({
  visible,
  onClose,
  children,
  contentStyle,
  ...props
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      {...props}
    >
      <TouchableOpacity
        activeOpacity={1}
        style={styles.overlay}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.content, contentStyle]}
          onPress={(e) => e.stopPropagation()}
        >
          {children}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
    width: "85%",
    maxHeight: "80%",
  },
});

export default AppModal;
