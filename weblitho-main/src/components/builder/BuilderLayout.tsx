import { ReactNode } from "react";
import { Header } from "./Header";
import { ModelType } from "./SettingsDialog";

interface BuilderLayoutProps {
  children: ReactNode;
  onSettingsChange: (model: ModelType) => void;
}

export const BuilderLayout = ({ children, onSettingsChange }: BuilderLayoutProps) => {
  return (
    <div className="h-screen flex flex-col bg-editor-bg overflow-hidden">
      <Header onSettingsChange={onSettingsChange} />
      
      <div className="flex-1 flex overflow-hidden relative">
        {children}
      </div>
    </div>
  );
};
