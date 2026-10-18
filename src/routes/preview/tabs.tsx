import { createSignal } from "solid-js";
import { PreviewPage, Specimen } from "~/components/preview/preview-page";
import { Tab, TabPanel, Tabs, TabsList } from "~/components/ui-kit";
import styles from "~/styles/pages/preview.module.css";

function Example(props: { counts?: boolean }) {
  const [tab, setTab] = createSignal("posts");
  return (
    <Tabs value={tab()} onChange={setTab}>
      <TabsList aria-label="Sections">
        <Tab value="posts" count={props.counts ? 24 : undefined}>
          Notes
        </Tab>
        <Tab value="tags" count={props.counts ? 9 : undefined}>
          Tags
        </Tab>
        <Tab value="authors" count={props.counts ? 5 : undefined}>
          Authors
        </Tab>
        <Tab value="off" disabled>
          Disabled
        </Tab>
      </TabsList>
      <TabPanel value="posts">
        <p class={styles.box}>Notes panel</p>
      </TabPanel>
      <TabPanel value="tags">
        <p class={styles.box}>Tags panel</p>
      </TabPanel>
      <TabPanel value="authors">
        <p class={styles.box}>Authors panel</p>
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
