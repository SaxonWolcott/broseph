import { Button, Card, CardBody, CardHeader } from '@heroui/react';

export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="flex flex-col items-center gap-2 pb-0">
          <h1 className="text-3xl font-bold">Broseph</h1>
          <p className="text-default-500">Stay connected with your crew</p>
        </CardHeader>
        <CardBody className="flex flex-col items-center gap-4 pt-6">
          <p className="text-center text-default-600">
            A group messaging app designed to help friends stay in touch.
          </p>
          <div className="flex gap-2">
            <Button color="primary" variant="solid">
              Get Started
            </Button>
            <Button color="default" variant="bordered">
              Learn More
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
