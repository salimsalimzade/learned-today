import { createSignal } from "solid-js";
import { PreviewPage, Specimen } from "~/components/preview/preview-page";
import { Tab, TabPanel, Tabs, TabsList } from "~/components/ui-kit";
import styles from "~/styles/pages/preview.module.css";

function Example(props: { counts?: boolean }) {
  const [tab, setTab] = createSignal("posts");
  return (
    <Tabs value={tab()} onChange={setTab}>
      <TabsList aria-label="Bölmələr">
        <Tab value="posts" count={props.counts ? 24 : undefined}>
          Qeydlər
        </Tab>
        <Tab value="tags" count={props.counts ? 9 : undefined}>
          Teqlər
        </Tab>
        <Tab value="authors" count={props.counts ? 5 : undefined}>
          Müəlliflər
        </Tab>
        <Tab value="off" disabled>
          Söndürülüb
        </Tab>
      </TabsList>
      <TabPanel value="posts">
        <p class={styles.box}>Qeydlər paneli</p>
      </TabPanel>
      <TabPanel value="tags">
        <p class={styles.box}>Teqlər paneli</p>
      </TabPanel>
      <TabPanel value="authors">
        <p class={styles.box}>Müəlliflər paneli</p>
      </TabPanel>
    </Tabs>
  );
}

export default function TabsPreview() {
  return (
    <PreviewPage title="Tabs" description="Kobalte Tabs with a sliding indicator. Arrow keys move between tabs.">
      <Specimen title="With counts" stack>
        {() => <Example counts />}
      </Specimen>
      <Specimen title="Plain" stack>
        {() => <Example />}
      </Specimen>
    </PreviewPage>
  );
}
